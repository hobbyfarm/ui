PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[", ]//g')

echo "Building HobbyFarm UI $PACKAGE_VERSION"

npm i

ng build --prod --aot

docker build -t "hobbyfarm/ui" . 

docker tag "hobbyfarm/ui" "hobbyfarm/ui:$PACKAGE_VERSION"

docker push "hobbyfarm/ui:$PACKAGE_VERSION"

echo "HobbyFarm UI built. Pushed version $PACKAGE_VERSION to Docker hub"
