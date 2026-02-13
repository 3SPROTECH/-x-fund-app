# frozen_string_literal: true

class InvestmentProjectProperty < ApplicationRecord
  belongs_to :investment_project
  belongs_to :property
end
