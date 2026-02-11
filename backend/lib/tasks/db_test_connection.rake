# Test de la connexion PostgreSQL
# Usage: bundle exec rake db:test_connection
namespace :db do
  desc "Teste la connexion à la base de données PostgreSQL"
  task test_connection: :environment do
    puts "Test de connexion PostgreSQL..."
    begin
      ActiveRecord::Base.connection.execute("SELECT 1")
      puts "✓ Connexion réussie."
      puts "  Base: #{ActiveRecord::Base.connection.current_database}"
      puts "  Host: #{ActiveRecord::Base.connection_db_config.configuration_hash[:host]}"
    rescue => e
      puts "✗ Échec: #{e.message}"
      exit 1
    end
  end
end
