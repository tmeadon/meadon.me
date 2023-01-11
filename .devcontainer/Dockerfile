FROM golang:1.19.5-alpine3.17

# VARIANT can be either 'hugo' for the standard version or 'hugo_extended' for the extended version.
ARG VARIANT=hugo_extended
# VERSION can be either 'latest' or a specific version number
ARG VERSION=latest

RUN apk add --update --no-cache ca-certificates openssl git curl && \
    case ${VERSION} in \
    latest) \
    export VERSION=$(curl -s https://api.github.com/repos/gohugoio/hugo/releases/latest | grep "tag_name" | awk '{print substr($2, 3, length($2)-4)}') ;;\
    esac && \
    echo ${VERSION} && \
    wget -O ${VERSION}.tar.gz https://github.com/gohugoio/hugo/releases/download/v${VERSION}/${VARIANT}_${VERSION}_Linux-64bit.tar.gz && \
    tar xf ${VERSION}.tar.gz && \
    mv hugo* /usr/bin/hugo && \
    go install github.com/yaegashi/muslstack@latest && \
    muslstack -s 0x800000 /usr/bin/hugo

FROM mcr.microsoft.com/vscode/devcontainers/base:0-alpine-3.17
# Required for hugo_extended
RUN apk add --update --no-cache libc6-compat
COPY --from=0 /usr/bin/hugo /usr/bin
COPY --from=0 /usr/local/go/ /usr/local/go/
ENV PATH="${PATH}:/usr/local/go/bin"
EXPOSE 1313
WORKDIR /src
CMD ["/usr/bin/hugo server"]