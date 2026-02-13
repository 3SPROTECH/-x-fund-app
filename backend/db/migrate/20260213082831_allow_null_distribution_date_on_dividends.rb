class AllowNullDistributionDateOnDividends < ActiveRecord::Migration[8.1]
  def change
    change_column_null :dividends, :distribution_date, true
  end
end
