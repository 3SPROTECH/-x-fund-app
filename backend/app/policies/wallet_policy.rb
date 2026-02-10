class WalletPolicy < ApplicationPolicy
  def show?
    admin? || record.user == user
  end

  def deposit?
    record.user == user
  end

  def withdraw?
    record.user == user
  end
end
