default: up

up:
	docker-compose up

clean:
	docker-compose down
	docker image rm final-project-team-4_api
	docker image rm final-project-team-4_db-init