class FinancialStatementPolicy < ApplicationPolicy
  def index?
    true
  end

  def show?
    true
  end

  def create?
    admin? || user.porteur_de_projet?
  end

  def update?
    admin? || (user.porteur_de_projet? && record.investment_project.owner == user)
  end

  def destroy?
    admin? || (user.porteur_de_projet? && record.investment_project.owner == user)
  end
end
