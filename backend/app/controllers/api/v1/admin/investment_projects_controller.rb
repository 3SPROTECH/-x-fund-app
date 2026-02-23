module Api
  module V1
    module Admin
      class InvestmentProjectsController < ApplicationController
        before_action :require_admin!
        before_action :set_project, only: [:show, :update, :destroy, :approve, :reject, :request_info, :advance_status, :assign_analyst, :report, :send_contract, :check_signature_status]

        def index
          projects = InvestmentProject.includes(properties: :owner).all
          projects = projects.where(status: params[:status]) if params[:status].present?
          if params[:search].present?
            q = "%#{params[:search]}%"
            projects = projects.where("investment_projects.title ILIKE :q OR investment_projects.description ILIKE :q", q: q)
          end
          projects = paginate(projects.order(created_at: :desc))

          render json: {
            data: projects.map { |p| InvestmentProjectSerializer.new(p).serializable_hash[:data] },
            meta: pagination_meta(projects)
          }
        end

        def show
          render json: { data: InvestmentProjectSerializer.new(@project).serializable_hash[:data] }
        end

        def create
          property_ids = Array(params[:property_ids]).presence || (params[:property_id].present? ? [params[:property_id]] : nil)
          if property_ids.blank?
            return render json: { errors: ["Veuillez sélectionner au moins un bien"] }, status: :unprocessable_entity
          end

          props = Property.where(id: property_ids)
          if props.count != property_ids.size
            return render json: { errors: ["Un ou plusieurs biens sont introuvables"] }, status: :unprocessable_entity
          end

          props.each do |property|
            if property.investment_project.present?
              return render json: { errors: ["Le bien « #{property.title} » a déjà un projet"] }, status: :unprocessable_entity
            end
          end

          @project = InvestmentProject.new(admin_project_params)
          if admin_project_params[:total_shares].to_i.positive?
            @project.total_shares = admin_project_params[:total_shares].to_i
            @project.total_amount_cents = @project.total_shares * @project.share_price_cents
          else
            @project.total_shares = @project.total_amount_cents / @project.share_price_cents
          end

          if @project.save
            property_ids.each { |pid| InvestmentProjectProperty.create!(investment_project_id: @project.id, property_id: pid) }
            props.each { |p| p.update!(status: :en_financement) if p.brouillon? }
            Assignments::AnalystAssignmentService.assign!(@project) if @project.pending_analysis?
            render json: { data: InvestmentProjectSerializer.new(@project).serializable_hash[:data] }, status: :created
          else
            render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def update
          if @project.update(admin_project_params)
            render json: { data: InvestmentProjectSerializer.new(@project).serializable_hash[:data] }
          else
            render json: { errors: @project.errors.full_messages }, status: :unprocessable_entity
          end
        end

        def destroy
          @project.destroy!
          render json: { message: "Projet d'investissement supprime." }
        end

        def approve
          @project.update!(
            status: :approved,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )
          log_admin_action("approve_project", @project, { comment: params[:comment] })
          NotificationService.notify_project_owner!(@project, actor: current_user, type: "project_approved", title: "Projet approuve", body: "Votre projet « #{@project.title} » a ete approuve.")
          NotificationService.notify_project_analyst!(@project, actor: current_user, type: "project_approved", title: "Projet approuve", body: "Le projet « #{@project.title} » a ete approuve par l'administrateur.")
          render json: {
            message: "Projet approuve avec succes.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        def reject
          @project.update!(
            status: :rejected,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )
          log_admin_action("reject_project", @project, { comment: params[:comment] })
          NotificationService.notify_project_owner!(@project, actor: current_user, type: "project_rejected", title: "Projet refuse", body: "Votre projet « #{@project.title} » a ete refuse.#{params[:comment].present? ? " Motif : #{params[:comment]}" : ''}")
          NotificationService.notify_project_analyst!(@project, actor: current_user, type: "project_rejected", title: "Projet refuse", body: "Le projet « #{@project.title} » a ete refuse par l'administrateur.")
          render json: {
            message: "Projet rejete.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        def request_info
          @project.update!(
            status: :info_requested,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )
          log_admin_action("request_info", @project, { comment: params[:comment] })
          NotificationService.notify_project_owner!(@project, actor: current_user, type: "info_requested", title: "Complements demandes", body: "Des complements d'information sont demandes pour votre projet « #{@project.title} ».#{params[:comment].present? ? " Commentaire : #{params[:comment]}" : ''}")
          render json: {
            message: "Complements d'information demandes.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        def assign_analyst
          analyst = User.analyste.find_by(id: params[:analyst_id])
          unless analyst
            return render json: { errors: ["Analyste introuvable"] }, status: :unprocessable_entity
          end

          @project.update!(
            analyst_id: analyst.id,
            analyst_opinion: :opinion_pending,
            analyst_comment: nil,
            analyst_legal_check: false,
            analyst_financial_check: false,
            analyst_risk_check: false,
            analyst_reviewed_at: nil
          )
          log_admin_action("assign_analyst", @project, { analyst_id: analyst.id, analyst_name: analyst.full_name })
          NotificationService.notify!(user: analyst, actor: current_user, notifiable: @project, type: "analyst_assigned", title: "Projet assigne", body: "Le projet « #{@project.title} » vous a ete assigne pour analyse.")

          render json: {
            message: "Analyste assigne avec succes.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        def advance_status
          new_status = params[:status]
          unless InvestmentProject.statuses.key?(new_status)
            return render json: { errors: ["Statut invalide: #{new_status}"] }, status: :unprocessable_entity
          end

          old_status = @project.status
          @project.update!(
            status: new_status,
            reviewed_by_id: current_user.id,
            reviewed_at: Time.current,
            review_comment: params[:comment]
          )
          log_admin_action("advance_status", @project, { from: old_status, to: new_status, comment: params[:comment] })
          NotificationService.notify_project_owner!(@project, actor: current_user, type: "project_status_changed", title: "Statut projet modifie", body: "Le statut de votre projet « #{@project.title} » a ete mis a jour : #{new_status}.")
          NotificationService.notify_project_analyst!(@project, actor: current_user, type: "project_status_changed", title: "Statut projet modifie", body: "Le statut du projet « #{@project.title} » a ete mis a jour : #{new_status}.")
          render json: {
            message: "Statut du projet mis a jour: #{new_status}.",
            data: InvestmentProjectSerializer.new(@project).serializable_hash[:data]
          }
        end

        def report
          report = @project.analyst_reports.order(created_at: :desc).first
          unless report
            return render json: { error: "Aucun rapport trouve." }, status: :not_found
          end

          render json: {
            report: AnalystReportSerializer.new(report).serializable_hash[:data]
          }
        end

        def send_contract
          unless @project.approved? || @project.legal_structuring?
            return render json: { errors: ["Le projet doit etre approuve pour envoyer le contrat."] }, status: :unprocessable_entity
          end

          pdf_base64 = params[:pdf_base64]
          if pdf_base64.blank?
            return render json: { errors: ["Le PDF du contrat est requis."] }, status: :unprocessable_entity
          end

          begin
            pdf_binary = Base64.decode64(pdf_base64)
            result = YousignService.send_contract_for_signing!(@project, pdf_binary)

            log_admin_action("send_contract", @project, {
              yousign_signature_request_id: result[:signature_request_id],
              yousign_signer_id: result[:signer_id]
            })

            NotificationService.notify_project_owner!(
              @project,
              actor: current_user,
              type: "contract_sent",
              title: "Contrat a signer",
              body: "Le contrat de votre projet \"#{@project.title}\" est pret a etre signe. Consultez votre email ou connectez-vous pour signer."
            )

            render json: {
              message: "Contrat envoye pour signature via YouSign.",
              data: InvestmentProjectSerializer.new(@project.reload).serializable_hash[:data],
              signature_link: result[:signature_link]
            }
          rescue YousignService::YousignError => e
            render json: { errors: ["Erreur YouSign: #{e.message}"] }, status: :unprocessable_entity
          rescue => e
            Rails.logger.error("[SendContract] Unexpected error: #{e.message}")
            render json: { errors: ["Erreur inattendue lors de l'envoi du contrat."] }, status: :internal_server_error
          end
        end

        def check_signature_status
          unless @project.yousign_signature_request_id.present?
            return render json: { errors: ["Aucune demande de signature trouvee."] }, status: :not_found
          end

          begin
            status_data = YousignService.get_status(@project.yousign_signature_request_id)
            yousign_status = status_data["status"]

            @project.update!(yousign_status: yousign_status)

            # Auto-advance if signing is done
            if yousign_status == "done" && @project.signing?
              @project.update!(status: :legal_structuring)
              log_admin_action("signature_completed", @project, { yousign_status: yousign_status })
            end

            render json: {
              yousign_status: yousign_status,
              data: InvestmentProjectSerializer.new(@project.reload).serializable_hash[:data]
            }
          rescue YousignService::YousignError => e
            render json: { errors: ["Erreur YouSign: #{e.message}"] }, status: :unprocessable_entity
          end
        end

        private

        def require_admin!
          unless current_user.administrateur?
            render json: { error: "Acces reserve aux administrateurs." }, status: :forbidden
          end
        end

        def log_admin_action(action, resource, data = {})
          AuditLog.create!(
            user: current_user,
            auditable: resource,
            action: action,
            changes_data: data,
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )
        rescue => e
          Rails.logger.error("Admin audit log failed: #{e.message}")
        end

        def set_project
          @project = InvestmentProject.find(params[:id])
        end

        def admin_project_params
          params.require(:investment_project).permit(
            :title, :description, :status, :operation_type, :total_amount_cents, :share_price_cents,
            :total_shares, :min_investment_cents, :max_investment_cents,
            :funding_start_date, :funding_end_date, :management_fee_percent,
            :gross_yield_percent, :net_yield_percent,
            # Finance fields
            :notary_fees_cents, :works_budget_cents, :financial_fees_cents,
            :equity_cents, :bank_loan_cents, :projected_revenue_cents, :projected_margin_cents,
            :bank_name, :bank_loan_status, :duration_months, :payment_frequency,
            # Guarantee fields
            :has_first_rank_mortgage, :has_share_pledge, :has_fiducie,
            :has_interest_escrow, :has_works_escrow, :has_personal_guarantee,
            :has_gfa, :has_open_banking, :risk_description,
            # Commercialization fields
            :pre_commercialization_percent, :exit_price_per_sqm_cents, :exit_scenario,
            :planned_acquisition_date, :planned_delivery_date, :planned_repayment_date,
            # File attachments
            :contrat_obligataire, :fici_document, :pv_decision, :note_operation,
            :price_grid, :block_buyer_loi, :sale_agreement, :projected_balance_sheet,
            additional_documents: []
          )
        end
      end
    end
  end
end
