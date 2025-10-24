.PHONY: all smoke smoke-local smoke-remote

all: smoke

smoke:
	./tools/smoke.sh

smoke-local:
	./tools/smoke-local.sh

smoke-remote:
	./tools/smoke-remote.sh

.PHONY: smoke-json smoke-json-remote
smoke-json:
	./tools/smoke-json.sh

smoke-json-remote:
	./tools/smoke-json.sh --only remote --strict --timeout 8
