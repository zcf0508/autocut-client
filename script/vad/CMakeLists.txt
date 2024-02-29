cmake_minimum_required(VERSION 3.22)
project(vad_addon)

set(CMAKE_CXX_STANDARD 11)

# Base settings
#==================================================================
# env var supported by cmake-js
add_definitions(-DNAPI_VERSION=4)
include_directories(${CMAKE_JS_INC})
# For Windows, only support "Release" mode now
set(CMAKE_BUILD_TYPE "Release")
#==================================================================

# Include third_lib
#==================================================================
set(THIRD_LIB_ROOT_PATH ${PROJECT_SOURCE_DIR}/src/third_lib)
message("****************THIRD LIB INCLUDE********************")
message("* System: " ${CMAKE_HOST_SYSTEM_NAME} " " ${CMAKE_HOST_SYSTEM_PROCESSOR})
if (${CMAKE_HOST_SYSTEM_NAME} MATCHES "Darwin")
    if (${CMAKE_HOST_SYSTEM_PROCESSOR} MATCHES "arm64")
        set(FASTDEPLOY_INSTALL_DIR ${THIRD_LIB_ROOT_PATH}/fastdeploy/mac_arm64)
    elseif(${CMAKE_HOST_SYSTEM_PROCESSOR} MATCHES "x86_64" OR ${CMAKE_HOST_SYSTEM_PROCESSOR} MATCHES "AMD64")
        set(FASTDEPLOY_INSTALL_DIR ${THIRD_LIB_ROOT_PATH}/fastdeploy/mac_x86_64)
    endif ()
elseif (${CMAKE_HOST_SYSTEM_NAME} MATCHES "Windows")
    if (${CMAKE_HOST_SYSTEM_PROCESSOR} MATCHES "x86_64" OR ${CMAKE_HOST_SYSTEM_PROCESSOR} MATCHES "AMD64")
        set(FASTDEPLOY_INSTALL_DIR ${THIRD_LIB_ROOT_PATH}/fastdeploy/win_x86_64)
    endif ()
elseif (${CMAKE_HOST_SYSTEM_NAME} MATCHES "Linux")
    if (${CMAKE_HOST_SYSTEM_PROCESSOR} MATCHES "x86_64" OR ${CMAKE_HOST_SYSTEM_PROCESSOR} MATCHES "AMD64")
        set(FASTDEPLOY_INSTALL_DIR ${THIRD_LIB_ROOT_PATH}/fastdeploy/linux_x86_64)
    elseif(${CMAKE_HOST_SYSTEM_PROCESSOR} MATCHES "aarch64")
        set(FASTDEPLOY_INSTALL_DIR ${THIRD_LIB_ROOT_PATH}/fastdeploy/linux_aarch64)
    endif ()
endif ()

message("")
if (NOT DEFINED FASTDEPLOY_INSTALL_DIR)
    message(FATAL_ERROR "* Your architecture is temporarily not supported." )
endif ()

include(${FASTDEPLOY_INSTALL_DIR}/FastDeploy.cmake)
# Add FastDeploy dependency header file
include_directories(${FASTDEPLOY_INCS})
if(${CMAKE_HOST_SYSTEM_NAME} MATCHES "Windows" OR ${CMAKE_HOST_SYSTEM_NAME} MATCHES "Linux")
    # For Linux, Windows, copy fastdeploy dll
    message("* Copy: Using " ${CMAKE_HOST_SYSTEM_NAME} "; Copy fastdeploy dll")
    install_fastdeploy_libraries(${CMAKE_CURRENT_BINARY_DIR}/Release)
endif()
#==================================================================

# Explicitly add to enable code insight
add_library(${PROJECT_NAME} SHARED ${CMAKE_JS_SRC} src/main.cc src/wav.h src/vad.cc src/vad.h)
set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

# Include N-API wrappers
#==================================================================
execute_process(COMMAND node -p "require('node-addon-api').include"
        WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
        OUTPUT_VARIABLE NODE_ADDON_API_DIR
        )
string(REPLACE "\n" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
string(REPLACE "\"" "" NODE_ADDON_API_DIR ${NODE_ADDON_API_DIR})
target_include_directories(${PROJECT_NAME} PRIVATE ${NODE_ADDON_API_DIR})
#==================================================================

target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} ${FASTDEPLOY_LIBS})

if (${CMAKE_HOST_SYSTEM_NAME} MATCHES "Windows")
    target_link_options(${PROJECT_NAME} PRIVATE ${CMAKE_SHARED_LINKER_FLAGS})
endif ()

if(MSVC AND CMAKE_JS_NODELIB_DEF AND CMAKE_JS_NODELIB_TARGET)
    # Generate node.lib
    execute_process(COMMAND ${CMAKE_AR} /def:${CMAKE_JS_NODELIB_DEF} /out:${CMAKE_JS_NODELIB_TARGET} ${CMAKE_STATIC_LINKER_FLAGS})
endif()
