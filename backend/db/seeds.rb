puts "Seeding database..."

# Admin user
admin = User.find_or_create_by!(email: "admin@x-fund.com") do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.first_name = "Admin"
  u.last_name = "X-Fund"
  u.role = :administrateur
  u.kyc_status = :verified
  u.kyc_verified_at = Time.current
end
puts "  Admin created: #{admin.email}"

# Investor users
investors = []
3.times do |i|
  investor = User.find_or_create_by!(email: "investisseur#{i + 1}@example.com") do |u|
    u.password = "password123"
    u.password_confirmation = "password123"
    u.first_name = ["Jean", "Marie", "Pierre"][i]
    u.last_name = ["Dupont", "Martin", "Bernard"][i]
    u.phone = "+3361234567#{i}"
    u.role = :investisseur
    u.kyc_status = :verified
    u.kyc_verified_at = Time.current
    u.city = "Paris"
    u.country = "FR"
  end
  investors << investor
  puts "  Investor created: #{investor.email}"
end

# Project owner
porteur = User.find_or_create_by!(email: "porteur@example.com") do |u|
  u.password = "password123"
  u.password_confirmation = "password123"
  u.first_name = "Sophie"
  u.last_name = "Leroy"
  u.phone = "+33698765432"
  u.role = :porteur_de_projet
  u.kyc_status = :verified
  u.kyc_verified_at = Time.current
end
puts "  Project owner created: #{porteur.email}"

# Properties
property1 = Property.find_or_create_by!(title: "Residence Voltaire") do |p|
  p.owner = porteur
  p.description = "Bel immeuble de rapport dans le 11eme arrondissement de Paris"
  p.property_type = :immeuble
  p.address_line1 = "42 Boulevard Voltaire"
  p.city = "Paris"
  p.postal_code = "75011"
  p.country = "FR"
  p.acquisition_price_cents = 50_000_000
  p.estimated_value_cents = 52_000_000
  p.estimated_annual_yield_percent = 6.5
  p.investment_duration_months = 60
  p.status = :en_financement
end
puts "  Property created: #{property1.title}"

property2 = Property.find_or_create_by!(title: "Villa Mediterranee") do |p|
  p.owner = porteur
  p.description = "Villa de luxe avec vue mer a Nice"
  p.property_type = :maison
  p.address_line1 = "15 Promenade des Anglais"
  p.city = "Nice"
  p.postal_code = "06000"
  p.country = "FR"
  p.acquisition_price_cents = 120_000_000
  p.estimated_value_cents = 125_000_000
  p.estimated_annual_yield_percent = 5.2
  p.investment_duration_months = 84
  p.status = :en_financement
end
puts "  Property created: #{property2.title}"

# Investment Projects
project1 = InvestmentProject.find_or_create_by!(property: property1) do |p|
  p.title = "Projet Voltaire - Rendement Locatif"
  p.description = "Investissez dans un immeuble de rapport au coeur de Paris"
  p.total_amount_cents = 50_000_000
  p.share_price_cents = 100_000
  p.total_shares = 500
  p.min_investment_cents = 100_000
  p.max_investment_cents = 10_000_000
  p.funding_start_date = Date.current - 30.days
  p.funding_end_date = Date.current + 60.days
  p.status = :ouvert
  p.review_status = :approuve
  p.management_fee_percent = 2.0
  p.gross_yield_percent = 6.5
  p.net_yield_percent = 4.5
end
puts "  Project created: #{project1.title}"

project2 = InvestmentProject.find_or_create_by!(property: property2) do |p|
  p.title = "Projet Mediterranee - Plus-Value"
  p.description = "Participez a l'acquisition d'une villa premium a Nice"
  p.total_amount_cents = 120_000_000
  p.share_price_cents = 500_000
  p.total_shares = 240
  p.min_investment_cents = 500_000
  p.max_investment_cents = 24_000_000
  p.funding_start_date = Date.current - 15.days
  p.funding_end_date = Date.current + 90.days
  p.status = :ouvert
  p.review_status = :approuve
  p.management_fee_percent = 2.5
  p.gross_yield_percent = 5.2
  p.net_yield_percent = 2.7
end
puts "  Project created: #{project2.title}"

# Deposit funds into investor wallets
investors.each do |investor|
  wallet = investor.wallet
  Wallets::WalletService.new(wallet).deposit(
    amount_cents: 5_000_000,
    reference: "SEED-DEP-#{investor.id}-#{SecureRandom.hex(4).upcase}"
  )
  puts "  Deposited 50,000 EUR into #{investor.email}'s wallet"
end

puts "Seeding complete!"
