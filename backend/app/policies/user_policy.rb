class UserPolicy < ApplicationPolicy
  def show?
    admin? || record == user
  end

  def update?
    admin? || record == user
  end

  def destroy?
    admin?
  end

  def verify_kyc?
    admin?
  end

  def reject_kyc?
    admin?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.administrateur?
        scope.all
      else
        scope.where(id: user.id)
      end
    end
  end
end
