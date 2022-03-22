# OrbitDB Express REST API
A REST API server to manage OrbitDB.


## Deployment

**Run Containers**
```
docker run -p 5001:5001 -d --name ipfs -v /root/ipfs:/data/ipfs ipfs/go-ipfs daemon --migrate=true --agent-version-suffix=docker --enable-pubsub-experiment
docker run  -p 3000:3000 -d --name orbit-db-express -v /root/orbitdb:/app/orbitdb  --env-file .env vulcanlink/orbit-db-express
```
**Connect Network**
https://stackoverflow.com/questions/42385977/accessing-a-docker-container-from-another-container
```
docker network create network1
docker network connect network1 ipfs
docker network connect network1 orbit-db-express
docker network inspect network1
```

## Insomnia Docs
You can use [insomnia.rest](https://insomnia.rest/) to test out requests with an easy to use GUI. Sync the Insomnia environment using the [orbit-db-express-insomnia](https://github.com/owlprotocol/orbit-db-express-insomnia) git sync. See the Insomnia docs on [git-sync](https://docs.insomnia.rest/insomnia/git-sync) to learn more on how to get set up.

## Special Thanks
Special thanks to [orbit-db-http-api](https://github.com/orbitdb/orbit-db-http-api) project from which this project is mostly inspired from.
