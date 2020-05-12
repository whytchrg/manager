{
    "targets": [{
        "target_name": "analysis",
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
        'conditions': [
            ['OS=="mac"', {
                'xcode_settings': {
                    'GCC_ENABLE_CPP_EXCEPTIONS': 'YES'
                }
            }]
        ],
        "sources": [
            "cpp/main.cpp",
            "cpp/functions.cpp",
            "cpp/analysis.cpp",
            "cpp/analyse.cpp"
        ],
        'include_dirs': [
            "<!@(node -p \"require('node-addon-api').include\")",
            "/usr/",
            "/usr/local/lib",
            "/usr/X11R6/include",
            "/usr/X11R6/lib"
        ],
        'libraries': [
            '-I/usr/X11R6/include',
            '-L/usr/X11R6/lib',
            '-lX11',
            '-lpng'
        ],
        'dependencies': [
            "<!(node -p \"require('node-addon-api').gyp\")"
        ],
        'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    }]
}
