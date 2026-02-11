class PropertyPolicy < ApplicationPolicy
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
    admin? || record.owner == user
  end

  def destroy?
    admin? || (record.owner == user && record.brouillon?)
  end

  def create_project?
    admin? || record.owner == user
  end

  def upload_photos?
    admin? || record.owner == user
  end

  def delete_photo?
    admin? || record.owner == user
  end

  class Scope < ApplicationPolicy::Scope
    def resolve
      if user.administrateur?
        scope.all
      elsif user.porteur_de_projet?
        scope.where(owner: user).or(scope.published)
      else
        scope.published
      end
    end
  end
end
