class AuditLogPolicy < ApplicationPolicy
  def index?
    admin?
  end

  def show?
    admin?
  end
end
