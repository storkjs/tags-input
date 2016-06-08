module.exports = function(grunt) {
	require('jit-grunt')(grunt);

	grunt.initConfig({
		watch: {
			styles: {
				files: ['src/*.less'], // which files to watch
				tasks: ['less'],
				options: {
					nospawn: true
				}
			},
			scripts: {
				files: ['src/*.js'], // which files to watch
				tasks: ['uglify'],
				options: {
					nospawn: true
				}
			}
		},
		less: {
			development: {
				options: {
					compress: false,
					yuicompress: false,
					optimization: 2
				},
				files: {
					"dist/tags-input.css": "src/tags-input.less", // destination file and source file
					"dist/simple-theme.css": "src/simple-theme.less" // destination file and source file
				}
			},
			production: {
				options: {
					compress: true,
					yuicompress: true,
					optimization: 2
				},
				files: {
					"dist/tags-input.min.css": "src/tags-input.less", // destination file and source file
					"dist/simple-theme.min.css": "src/simple-theme.less" // destination file and source file
				}
			}
		},
		uglify: {
			options: {
				mangle: false,
				screwIE8: true
			},
			development: {
				options: {
					compress: false,
					beautify: {
						beautify: true,
						"indent_level": 2
					}
				},
				files: {
					'dist/tags-input.js': ['src/tags-input.js']
				}
			},
			production: {
				options: {
					compress: true,
					sourceMap: true,
					sourceMapName: 'dist/tags-input.min.js.map'
				},
				files: {
					'dist/tags-input.min.js': ['src/tags-input.js']
				}
			}
		}
	});

	grunt.registerTask('watch-files', ['watch']);

	grunt.registerTask('dist', ['less', 'uglify']);
};