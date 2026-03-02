require "httparty"

class YousignService
  BASE_URL = ENV.fetch("YOUSIGN_BASE_URL", "https://api-sandbox.yousign.app/v3")
  API_KEY  = ENV.fetch("YOUSIGN_API_KEY", "")

  class YousignError < StandardError; end

  # Orchestrates the full signing flow:
  # 1. Create signature request (ordered: admin signs first)
  # 2. Upload PDF document
  # 3. Add admin as first signer (signing_order: 1)
  # 4. Add project owner as second signer (signing_order: 2)
  # 5. Activate the request
  def self.send_contract_for_signing!(project, pdf_binary, admin_user:)
    owner = project.owner

    # 1) Create signature request with ordered signers
    sr = create_signature_request(project)
    signature_request_id = sr["id"]

    # 2) Upload the PDF document
    doc = upload_document(signature_request_id, pdf_binary, "convention_partenariat_#{project.id}.pdf")
    document_id = doc["id"]
    total_pages = doc["total_pages"] || 1

    # 3) Add the admin as FIRST signer (platform signs first)
    admin_signer = add_signer(
      signature_request_id,
      document_id,
      admin_user,
      total_pages
    )
    admin_signer_id = admin_signer["id"]

    # 4) Add the project owner as SECOND signer (signs after admin)
    owner_signer = add_signer(
      signature_request_id,
      document_id,
      owner,
      total_pages
    )
    owner_signer_id = owner_signer["id"]

    # 5) Activate the signature request
    activated = activate(signature_request_id)

    # Extract signature links from the activated response
    signers = activated["signers"] || []
    owner_signature_link = signers.find { |s| s["id"] == owner_signer_id }&.dig("signature_link")
    admin_signature_link = signers.find { |s| s["id"] == admin_signer_id }&.dig("signature_link")

    # Persist YouSign identifiers on the project
    project.update!(
      yousign_signature_request_id: signature_request_id,
      yousign_document_id: document_id,
      yousign_signer_id: owner_signer_id,
      yousign_signature_link: owner_signature_link,
      yousign_admin_signer_id: admin_signer_id,
      yousign_admin_signature_link: admin_signature_link,
      yousign_status: "awaiting_admin",
      yousign_sent_at: Time.current
    )

    { signature_request_id:, signer_id: owner_signer_id, admin_signer_id:, signature_link: owner_signature_link, admin_signature_link: }
  end

  # Step 1: Create a draft signature request with ordered signers
  def self.create_signature_request(project)
    body = {
      name: "Convention de partenariat - #{project.title}",
      delivery_mode: "email",
      ordered_signers: true,
      timezone: "Europe/Paris",
      audit_trail_locale: "fr"
    }

    response = post("/signature_requests", body: body.to_json, headers: json_headers)
    handle_response!(response, "create_signature_request")
  end

  # Step 2: Upload a PDF document (multipart)
  def self.upload_document(signature_request_id, pdf_binary, filename)
    # Use Tempfile for reliable HTTParty multipart upload
    tempfile = Tempfile.new([filename.sub('.pdf', ''), '.pdf'], binmode: true)
    begin
      tempfile.write(pdf_binary)
      tempfile.rewind

      response = HTTParty.post(
        "#{BASE_URL}/signature_requests/#{signature_request_id}/documents",
        headers: auth_headers,
        multipart: true,
        body: {
          file: tempfile,
          nature: "signable_document",
          parse_anchors: "true"
        }
      )
      handle_response!(response, "upload_document")
    ensure
      tempfile.close
      tempfile.unlink
    end
  end

  # Step 3: Add a signer (signature field is placed via smart anchor in the PDF)
  # Order is determined by the sequence signers are added (admin first, owner second)
  # combined with ordered_signers: true on the signature request.
  def self.add_signer(signature_request_id, document_id, user, last_page)
    body = {
      info: {
        first_name: sanitize_name(user.first_name),
        last_name: sanitize_name(user.last_name),
        email: user.email,
        locale: "fr"
      },
      signature_level: "electronic_signature",
      signature_authentication_mode: "no_otp"
    }

    response = post(
      "/signature_requests/#{signature_request_id}/signers",
      body: body.to_json,
      headers: json_headers
    )
    handle_response!(response, "add_signer")
  end

  # Step 4: Activate the signature request (sends email to signer)
  def self.activate(signature_request_id)
    response = HTTParty.post(
      "#{BASE_URL}/signature_requests/#{signature_request_id}/activate",
      headers: json_headers
    )
    handle_response!(response, "activate")
  end

  # Send a document for porteur-only signing (no admin co-sign)
  def self.send_document_for_porteur!(project, pdf_binary, document_type:, document_title:)
    owner = project.owner

    sr = create_signature_request_simple(document_title)
    signature_request_id = sr["id"]

    doc = upload_document(signature_request_id, pdf_binary, "#{document_type}_#{project.id}.pdf")
    document_id = doc["id"]
    total_pages = doc["total_pages"] || 1

    signer = add_signer(signature_request_id, document_id, owner, total_pages)
    signer_id = signer["id"]

    activated = activate(signature_request_id)
    signers = activated["signers"] || []
    signature_link = signers.find { |s| s["id"] == signer_id }&.dig("signature_link")

    # Store in JSONB column
    status_data = project.legal_documents_status || {}
    status_data[document_type] = {
      "yousign_request_id" => signature_request_id,
      "yousign_document_id" => document_id,
      "yousign_signer_id" => signer_id,
      "yousign_signature_link" => signature_link,
      "status" => "sent",
      "sent_at" => Time.current.iso8601
    }
    project.update!(legal_documents_status: status_data)

    { signature_request_id:, signer_id:, signature_link: }
  end

  # Create a simple signature request (single signer, not ordered)
  def self.create_signature_request_simple(title)
    body = {
      name: title,
      delivery_mode: "email",
      ordered_signers: false,
      timezone: "Europe/Paris",
      audit_trail_locale: "fr"
    }
    response = post("/signature_requests", body: body.to_json, headers: json_headers)
    handle_response!(response, "create_signature_request_simple")
  end

  # Poll signature request status
  def self.get_status(signature_request_id)
    response = HTTParty.get(
      "#{BASE_URL}/signature_requests/#{signature_request_id}",
      headers: json_headers
    )
    handle_response!(response, "get_status")
  end

  private

  def self.post(path, options = {})
    HTTParty.post("#{BASE_URL}#{path}", options)
  end

  def self.auth_headers
    { "Authorization" => "Bearer #{API_KEY}" }
  end

  def self.json_headers
    auth_headers.merge("Content-Type" => "application/json")
  end

  # YouSign rejects accented/special characters in name fields
  def self.sanitize_name(name)
    sanitized = ActiveSupport::Inflector.transliterate(name.to_s).gsub(/[^a-zA-Z\s\-']/, '').strip
    sanitized.presence || "Utilisateur"
  end

  def self.handle_response!(response, context)
    unless response.success?
      error_body = response.parsed_response rescue response.body
      Rails.logger.error("[YousignService] #{context} failed (#{response.code}): #{error_body}")
      raise YousignError, "YouSign API error in #{context}: #{response.code} - #{error_body}"
    end

    response.parsed_response
  end
end
