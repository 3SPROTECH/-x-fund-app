require "httparty"

class YousignService
  BASE_URL = ENV.fetch("YOUSIGN_BASE_URL", "https://api-sandbox.yousign.app/v3")
  API_KEY  = ENV.fetch("YOUSIGN_API_KEY", "")

  class YousignError < StandardError; end

  # Orchestrates the full signing flow:
  # 1. Create signature request
  # 2. Upload PDF document
  # 3. Add signer with signature field
  # 4. Activate the request (sends email)
  def self.send_contract_for_signing!(project, pdf_binary)
    owner = project.owner

    # 1) Create signature request
    sr = create_signature_request(project)
    signature_request_id = sr["id"]

    # 2) Upload the PDF document
    doc = upload_document(signature_request_id, pdf_binary, "convention_partenariat_#{project.id}.pdf")
    document_id = doc["id"]
    total_pages = doc["total_pages"] || 1

    # 3) Add the project owner as signer with a signature field on the last page
    signer = add_signer(
      signature_request_id,
      document_id,
      owner,
      total_pages
    )
    signer_id = signer["id"]

    # 4) Activate the signature request
    activated = activate(signature_request_id)

    # Extract the signature link from the activated response
    signature_link = activated.dig("signers", 0, "signature_link")

    # Persist YouSign identifiers on the project
    project.update!(
      yousign_signature_request_id: signature_request_id,
      yousign_document_id: document_id,
      yousign_signer_id: signer_id,
      yousign_signature_link: signature_link,
      yousign_status: "ongoing",
      yousign_sent_at: Time.current,
      status: :signing
    )

    { signature_request_id:, signer_id:, signature_link: }
  end

  # Step 1: Create a draft signature request
  def self.create_signature_request(project)
    body = {
      name: "Convention de partenariat - #{project.title}",
      delivery_mode: "email",
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
  def self.add_signer(signature_request_id, document_id, owner, last_page)
    body = {
      info: {
        first_name: owner.first_name,
        last_name: owner.last_name,
        email: owner.email,
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

  def self.handle_response!(response, context)
    unless response.success?
      error_body = response.parsed_response rescue response.body
      Rails.logger.error("[YousignService] #{context} failed (#{response.code}): #{error_body}")
      raise YousignError, "YouSign API error in #{context}: #{response.code} - #{error_body}"
    end

    response.parsed_response
  end
end
