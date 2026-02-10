class ApplicationController < ActionController::API
  include Pundit::Authorization
  include ErrorHandler

  before_action :authenticate_user!
  before_action :set_current_attributes

  def authenticate_user!
    authenticate_api_v1_user!
  end

  def current_user
    current_api_v1_user
  end

  def paginate(collection)
    collection.page(params[:page] || 1).per(params[:per_page] || 20)
  end

  def pagination_meta(collection)
    {
      current_page: collection.current_page,
      total_pages: collection.total_pages,
      total_count: collection.total_count,
      per_page: collection.limit_value
    }
  end

  private

  def set_current_attributes
    Current.user = current_user
    Current.ip_address = request.remote_ip
    Current.user_agent = request.user_agent
  end
end
