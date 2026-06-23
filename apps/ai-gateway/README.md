# ai-gateway
This project contains AI agent logic & MCP server. 
Needs dependencies to be installed:
- Local embedding model `Xenova/all-MiniLM-L6-v2` (downloaded in `./.models` folder)
- Documentation indexes needed to be built (Stored in `./dist/ai-gateway/vectors.bin`)

Run `bun run gather` to download embedding model & to build indexes.

## Notes
- Port: 8001
- Docs indexes are built and stored in `./dist/ai-gateway/vectors.bin` and later used in docker image.
- The embedding model needs to be downloaded in the docker image. 