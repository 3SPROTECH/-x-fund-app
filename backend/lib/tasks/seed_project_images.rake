require "open-uri"

namespace :db do
  desc "Attach demo images from Unsplash to projects 2, 3, 4, 5, 9"
  task seed_project_images: :environment do
    mapping = {
      2 => { url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80", filename: "villa-mediterranee.jpg" },
      3 => { url: "https://images.unsplash.com/photo-1554469384-e58fac16e23a?auto=format&fit=crop&w=800&q=80", filename: "bureaux-haussmann.jpg" },
      4 => { url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80", filename: "residence-alouettes.jpg" },
      5 => { url: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80", filename: "residence-les-pins.jpg" },
      9 => { url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80", filename: "lotissement-horizon.jpg" },
    }

    mapping.each do |project_id, image|
      project = InvestmentProject.find_by(id: project_id)
      unless project
        puts "Project #{project_id} not found, skipping."
        next
      end

      puts "Downloading #{image[:filename]} for project #{project_id}..."
      file = URI.open(image[:url])
      project.additional_documents.attach(io: file, filename: image[:filename], content_type: "image/jpeg")
      puts "Attached #{image[:filename]} to project #{project_id} (#{project.title})"
    rescue => e
      puts "ERROR on project #{project_id}: #{e.message}"
    end

    puts "Done!"
  end
end
