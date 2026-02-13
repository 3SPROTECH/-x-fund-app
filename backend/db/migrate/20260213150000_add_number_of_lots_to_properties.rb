class AddNumberOfLotsToProperties < ActiveRecord::Migration[7.1]
  def change
    add_column :properties, :number_of_lots, :integer
  end
end
