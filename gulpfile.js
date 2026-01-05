const { src, dest, watch, series, parallel } = require("gulp");
const pug = require("gulp-pug");
const sass = require("gulp-dart-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const plumber = require("gulp-plumber");
const sourcemaps = require("gulp-sourcemaps");
const browserSync = require("browser-sync").create();
// const del = require("del");
const fs = require("fs");
const path = require("path");

const paths = {
  pug: {
    // ✅ 會輸出成 HTML 的入口頁：放在 src 根目錄（src/index.pug、src/about.pug...）
    src: ["src/*.pug", "!src/**/_*.pug"],
    // ✅ 監聽所有 pug（含 partial）
    watch: "src/**/*.pug",
    dest: "docs"
  },
  styles: {
    // ✅ 入口檔：二選一（你用 scss 就留 scss，用 sass 就改成 app.sass）
    src: "src/sass/app.sass",
    // src: "src/styles/app.scss",
    watch: "src/sass/**/*.{sass,scss}",
    dest: "docs/css"
  },
  js: {
    src: "src/js/**/*",
    watch: "src/js/**/*",
    dest: "docs/js"
  },
  images: {
    src: "src/images/**/*",
    watch: "src/images/**/*",
    dest: "docs/images"
  },
  assets: {
    src: "src/assets/**/*",
    watch: "src/assets/**/*",
    dest: "docs/assets"
  }
};

// ✅ 清空 docs（保留資料夾本身）
function clean(cb) {
  const outDir = path.join(__dirname, "docs");
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  fs.mkdirSync(outDir, { recursive: true });
  cb();
}


// ✅ Pug → HTML
function buildPug() {
  return src(paths.pug.src)
    .pipe(plumber())
    .pipe(pug({ pretty: true }))
    .pipe(dest(paths.pug.dest))
    .pipe(browserSync.stream());
}

// ✅ Sass/Scss → CSS（含 sourcemap + autoprefixer）
function buildStyles() {
  return src(paths.styles.src)
    .pipe(plumber())
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        includePaths: ["src/sass"],
        quietDeps: true,
      }).on("error", sass.logError)
    )
    .pipe(postcss([autoprefixer()]))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.styles.dest))
    .pipe(browserSync.stream());
}


// ✅ 靜態檔案：直接 copy 到 docs
function copyJs() {
  return src(paths.js.src).pipe(dest(paths.js.dest)).pipe(browserSync.stream());
}
function copyImages() {
  return src(paths.images.src).pipe(dest(paths.images.dest)).pipe(browserSync.stream());
}
function copyAssets() {
  return src(paths.assets.src).pipe(dest(paths.assets.dest)).pipe(browserSync.stream());
}

// ✅ BrowserSync：以 docs 當根目錄
function serve(cb) {
  browserSync.init({
    server: { baseDir: "docs" },
    notify: false,
    open: true
  });
  cb();
}

// ✅ Watch：存檔就重編譯/拷貝，畫面自動刷新
function watcher() {
  watch(paths.pug.watch, buildPug);
  watch(paths.styles.watch, buildStyles);
  watch(paths.js.watch, copyJs);
  watch(paths.images.watch, copyImages);
  watch(paths.assets.watch, copyAssets);
}

// build（單次）
const build = parallel(buildPug, buildStyles, copyJs, copyImages, copyAssets);

exports.clean = clean;
exports.build = series(build);
exports.default = series(build, serve, watcher);
