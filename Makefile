.PHONY: all
all: clean build

.PHONY: clean
clean:
	echo "Removing previous build"
	rm -rf ./docs

.PHONY: build
build:
	echo "building blog"
	hugo --gc --minify -d ./docs
