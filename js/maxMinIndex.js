//function to extract the index of max element in array
function indexOfMax(arr) {
    if (arr.length == 0) {
        return -1;
    }

    var max = arr[0];
    var maxIndex = 0;

    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            maxIndex = i;
            max = arr[i];
        }
    }
    return maxIndex;
}

function indexOfMin(arr) {
    var minIndex = 0;
    for (var i = 1; i < arr.length; i++) {
        if (arr[i] < arr[minIndex])
            minIndex = i;
    }
    return minIndex;
}