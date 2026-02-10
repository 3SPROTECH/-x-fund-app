class InvestmentPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    admin? || record.user == user
  end

  def create?
    user.investisseur? && user.kyc_verified?
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.administrateur?
        scope.all
      else
        scope.where(user: user)
      end
    end
  end
end
