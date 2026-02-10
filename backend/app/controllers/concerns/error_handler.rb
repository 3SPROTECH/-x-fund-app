module ErrorHandler
  extend ActiveSupport::Concern

  included do
    rescue_from ActiveRecord::RecordNotFound, with: :not_found
    rescue_from ActiveRecord::RecordInvalid, with: :unprocessable_entity_error
    rescue_from Pundit::NotAuthorizedError, with: :forbidden
    rescue_from ActionController::ParameterMissing, with: :bad_request
  end

  private

  def not_found
    render json: { error: "Ressource introuvable" }, status: :not_found
  end

  def unprocessable_entity_error(exception)
    render json: { errors: exception.record.errors.full_messages }, status: :unprocessable_entity
  end

  def forbidden
    render json: { error: "Vous n'etes pas autorise a effectuer cette action" }, status: :forbidden
  end

  def bad_request(exception)
    render json: { error: exception.message }, status: :bad_request
  end
end
