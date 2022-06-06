default: up

up:
	docker-compose up

clean:
	docker-compose down
	docker image rm final-project-team-4_api
	docker image rm final-project-team-4_db-init

shell:
	docker exec -it final-project-team-4-db-1 mongo --username root