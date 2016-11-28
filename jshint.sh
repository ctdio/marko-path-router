echo "Running jshint..."

./node_modules/.bin/jshint --exclude-path .jshintignore .

if [ $? != 0 ]; then
    echo "Found JSHINT Errors"
    exit 1
fi

echo "No JSHINT errors"
