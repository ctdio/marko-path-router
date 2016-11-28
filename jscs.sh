echo "Running jscs..."

./node_modules/.bin/jscs .

if [ $? != 0 ]; then
    echo "Found JSCS Errors"
    exit 1
fi

echo "No JSCS Errors"
