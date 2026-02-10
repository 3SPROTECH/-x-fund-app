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
end
