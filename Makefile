.PHONY: all
all: clean build

.PHONY: clean
clean:
	echo "Removing previous build"
	rm -rf ./blog_output

.PHONY: build
build:
	echo "building blog"
	hugo --gc --minify -d ./blog_output