Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # In development, allow localhost on any port and both localhost/127.0.0.1
    # In production, restrict to FRONTEND_URL only
    if Rails.env.development?
      origins "http://localhost:5173",
              "http://127.0.0.1:5173",
              "http://localhost:3000",
              "http://127.0.0.1:3000",
              %r{\Ahttp://localhost:\d+\z},
              %r{\Ahttp://127\.0\.0\.1:\d+\z}
    else
      origins ENV.fetch("FRONTEND_URL", "http://localhost:5173")
    end

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"],
      credentials: false,
      max_age: 600
  end
end
