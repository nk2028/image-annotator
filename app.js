const imageDisplay = document.getElementById('image-display');
const displayedImage = document.getElementById('displayed-image');
const coveringCanvas = document.getElementById('covering-canvas');

const imagePrevBtn = document.getElementById('image-prev');
const imageNextBtn = document.getElementById('image-next');
const dataPrevBtn = document.getElementById('data-prev');
const dataNextBtn = document.getElementById('data-next');

const imageIndex = document.getElementById('image-index');
const dataIndex = document.getElementById('data-index');

const fileButton = document.getElementById('file-button');
const fileInput = document.getElementById('file-input');
const exportBtn = document.getElementById('export-button');
const clearPageBtn = document.getElementById('clear-page-button');
const saveCacheBtn = document.getElementById('save-cache-button');
const clearCacheBtn = document.getElementById('clear-cache-button');

const form = document.getElementById('form');

// Load the images
const imageURLs = [];
// for (let i = 15; i <= 57; i++) {
//   imageURLs.push(`https://hiunnkyanq-1305783649.cos.accelerate.myqcloud.com/%E5%98%89%E5%90%89%E6%9C%AC/${i}.jpg`);
// }
for (let i = 10; i <= 52; i++) {
  imageURLs.push(`https://hiunnkyanq-1305783649.cos.accelerate.myqcloud.com/%E5%8F%A4%E9%80%B8%E5%8F%A2%E6%9B%B8%E6%9C%AC/${i}.png`);
}

// Load the annotated points, current image index, and annotations from cache
const cachedData = JSON.parse(localStorage.getItem('imageAnnotationApp')) || {};
let fileName = cachedData.fileName || '';
let currentImageIndex = cachedData.currentImageIndex || 0;
let currentDataIndex = cachedData.currentDataIndex || 0;
let data = cachedData.data || [];

const precision = 4;

const parseDataFile = (s) => {
  data = s
    .trimEnd()
    .split('\n')
    .slice(1)
    .map((line) => {
      const [字頭, 轉號, 韻圖開合, 韻圖母位置, 韻圖聲, 韻圖韻, 韻圖等, 是否無效_, 備註, x_, y_] = line.split(',');
      const imageIndex = parseInt(轉號, 10) - 1;
      const 是否無效 = 是否無效_ === '1' ? '1' : '0';
      const x = x_ == '' ? null : parseFloat(x_);
      const y = y_ == '' ? null : parseFloat(y_);
      return { 字頭, 韻圖開合, 韻圖母位置, 韻圖聲, 韻圖韻, 韻圖等, 是否無效, 備註, imageIndex, x, y };
    });
};

fileButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  fileName = file.name;
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    parseDataFile(reader.result);
    loadImage();
    loadData();
  });
  reader.readAsText(file);
});

// Refresh canvas
const refreshCanvas = () => {
  console.log('refreshCanvas called!');

  const width = displayedImage.offsetWidth;
  const height = displayedImage.offsetHeight;

  coveringCanvas.width = width;
  coveringCanvas.height = height;

  const ctx = coveringCanvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  data.forEach(({ imageIndex, x, y }, dataIndex) => {
    if (imageIndex === currentImageIndex && x != null && y != null) {
      ctx.fillStyle = dataIndex === currentDataIndex ? 'blue' : 'red';
      ctx.beginPath();
      ctx.arc(x * width, y * height, 4, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
};

displayedImage.addEventListener('load', refreshCanvas);

// Display the current image
const loadImage = () => {
  displayedImage.src = imageURLs[currentImageIndex];
  imageIndex.textContent = `${currentImageIndex + 1} / ${imageURLs.length}`;
};

loadImage();

// Display the current data
const loadData = () => {
  if (data.length === 0) return;

  const dataItem = data[currentDataIndex];

  // data fields
  const dataFields = '字頭,韻圖開合,韻圖母位置,韻圖聲,韻圖韻,韻圖等,是否無效,備註,imageIndex'.split(',');
  dataFields.forEach((dataField) => {
    const element = document.querySelector(`#data-display [name="${dataField}"]`);
    element.value = dataItem[dataField];
  });

  // special treatment for coordinates
  ['x', 'y'].forEach((dataField) => {
    const element = document.querySelector(`#data-display [name="${dataField}"]`);
    const value = dataItem[dataField];
    element.value = value == null ? '' : value.toFixed(precision);
  });

  dataIndex.textContent = `${currentDataIndex + 1} / ${data.length}`;
};

loadData();

// Handle navigation between images
imagePrevBtn.addEventListener('click', () => {
  if (currentImageIndex > 0) {
    currentImageIndex--;
    loadImage();
  }
});

imageNextBtn.addEventListener('click', () => {
  if (currentImageIndex < imageURLs.length - 1) {
    currentImageIndex++;
    loadImage();
  }
});

// Handle navigation between data items
dataPrevBtn.addEventListener('click', () => {
  if (currentDataIndex > 0) {
    currentDataIndex--;
    refreshCanvas();
    loadData();
  }
});

dataNextBtn.addEventListener('click', () => {
  if (currentDataIndex < data.length - 1) {
    currentDataIndex++;
    refreshCanvas();
    loadData();
  }
});

// Handle adding points
coveringCanvas.addEventListener('click', (event) => {
  const x = event.offsetX / coveringCanvas.offsetWidth;
  const y = event.offsetY / coveringCanvas.offsetHeight;

  console.log({ x, y });

  data[currentDataIndex].x = x;
  data[currentDataIndex].y = y;
  currentDataIndex++;

  refreshCanvas();
  loadData();
});

// Handle exporting data
exportBtn.addEventListener('click', () => {
  const dataString =
    '字頭,轉號,韻圖開合(修正後),韻圖母位置,韻圖聲,韻圖韻,韻圖等,x,y\n' +
    data
      .map(({ 字頭, 韻圖開合, 韻圖母位置, 韻圖聲, 韻圖韻, 韻圖等, 是否無效_, 備註, imageIndex, x, y }) => {
        const 轉號 = imageIndex + 1;
        const 是否無效 = 是否無效_ === '1' ? '1' : '';
        const x_ = x == null ? '' : x.toFixed(precision);
        const y_ = y == null ? '' : y.toFixed(precision);
        return [字頭, 轉號, 韻圖開合, 韻圖母位置, 韻圖聲, 韻圖韻, 韻圖等, 是否無效, 備註, x_, y_].join(',');
      })
      .join('\n') +
    '\n';

  const blob = new Blob([dataString], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
});

// Handle clear page
clearPageBtn.addEventListener('click', () => {
  data = data.map((dataItem) => {
    if (dataItem.imageIndex === currentImageIndex) {
      dataItem.x = null;
      dataItem.y = null;
    }
    return dataItem;
  });

  refreshCanvas();
  loadData();
});

// Handle save cache
const saveToCache = () => {
  localStorage.setItem('imageAnnotationApp', JSON.stringify({ fileName, currentImageIndex, currentDataIndex, data }));
};

saveCacheBtn.addEventListener('click', saveToCache);
window.addEventListener('beforeunload', saveToCache);

// Handle clear cache
clearCacheBtn.addEventListener('click', () => {
  fileName = null;
  currentImageIndex = null;
  currentDataIndex = null;
  data = null;
  localStorage.removeItem('imageAnnotationApp');

  refreshCanvas();
  loadData();
});

// prevent submit
form.addEventListener('submit', (event) => {
  event.preventDefault();
});
