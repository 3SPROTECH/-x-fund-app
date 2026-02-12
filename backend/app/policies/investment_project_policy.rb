class InvestmentProjectPolicy < ApplicationPolicy
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
    admin? || (user.porteur_de_projet? && record.owner == user && record.brouillon?)
  end

  def destroy?
    admin? || (user.porteur_de_projet? && record.owner == user && record.brouillon?)
  end

  def invest?
    user.investisseur? || admin?
  end

  def view_investors?
    true
  end

  def list_investors?
    admin? || (user.porteur_de_projet? && record.owner == user)
  end

  def upload_images?
    admin? || (user.porteur_de_projet? && record.owner == user)
  end

  def delete_image?
    admin? || (user.porteur_de_projet? && record.owner == user)
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.administrateur?
        scope.all
      elsif user.porteur_de_projet?
        scope.left_joins(:property)
             .where(properties: { owner_id: user.id })
             .or(scope.left_joins(:property).where.not(status: :brouillon))
             .distinct
      else
        scope.where.not(status: :brouillon)
      end
    end
  end
end
