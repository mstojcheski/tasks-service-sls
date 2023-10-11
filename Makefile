export AWS_ACCESS_KEY_ID ?= test
export AWS_SECRET_ACCESS_KEY ?= test
export AWS_DEFAULT_REGION = us-east-1

usage:           ## Show this help
	@fgrep -h "##" $(MAKEFILE_LIST) | fgrep -v fgrep | sed -e 's/\\$$//' | sed -e 's/##//'

install:         ## Install dependencies
	yarn
	which serverless || yarn global add serverless
	which localstack || pip install localstack

deploy-local:          ## Deploy the app
	@make install; \
		echo "Deploying Serverless app to local environment"; \
		SLS_DEBUG=1 serverless deploy --stage local

deploy-dev:          ## Deploy the app
	@make install; \
		echo "Deploying Serverless app to dev environment"; \
		SLS_DEBUG=1 serverless deploy --stage dev

run-lint:            ## Run code linter
	@yarn lint

run-test:            ## Run unit tests
	@yarn test

run-e2e-test:         ## Run e2e tests
	@yarn e2e-test

.PHONY: usage install deploy-local deploy-dev run-lint run-tests run-e2e-test
