/**
 * External dependencies
 */
const { execSync, exec } = require( 'child_process' );
const config = require( 'config' );
const fs = require( 'fs' );
const path = require( 'path' );
const logger = require( './logger' );
const { E2E_DEBUG } = process.env;

/**
 * Executes a shell command and return it as a Promise.
 *
 * @param {string} cmd shell command
 * @return {Promise<string>} output
 */
async function execShellCommand( cmd ) {
	return new Promise( resolve => {
		const cmdExec = exec( cmd, ( error, stdout ) => {
			if ( error ) {
				logger.warn( `CLI: ${ error.toString() }` );
				return resolve( error );
			}
			return resolve( stdout );
		} );
		cmdExec.stdout.on( 'data', data => {
			// remove the new line at the end
			data = data.replace( /\n$/, '' );
			logger.cli( `${ data }` );
		} );
	} );
}

function execSyncShellCommand( cmd ) {
	return execSync( cmd ).toString();
}

async function resetWordpressInstall() {
	const cmd = './bin/env.sh reset';
	await execShellCommand( cmd );
}

async function prepareUpdaterTest() {
	const cmd =
		'pnpx wp-env run tests-wordpress wp-content/plugins/jetpack-boost-dev/tests/e2e/bin/prep.sh';

	await execShellCommand( cmd );
}

async function execWpCommand( wpCmd ) {
	const cmd = `pnpx wp-env run tests-cli "${ wpCmd }"`;
	const result = await execShellCommand( cmd );

	// By default, `wp-env run` adds a newline to the end of the output.
	// Here we clean this up.
	if ( typeof result !== 'object' && result.length > 0 ) {
		return result.trim();
	}

	return result;
}

/**
 * Runs multiple wp commands in a single call
 *
 * @param {...string} commands Array of wp commands to run together
 */
async function execMultipleWpCommands( ...commands ) {
	return await execWpCommand( `bash -c '${ commands.join( ' && ' ) }'` );
}

async function logDebugLog() {
	let log = execSyncShellCommand( 'pnpx wp-env run tests-wordpress cat wp-content/debug.log' );

	const escapedDate = new Date().toISOString().split( '.' )[ 0 ].replace( /:/g, '-' );
	const filename = `debug_${ escapedDate }.log`;
	fs.writeFileSync( path.resolve( config.get( 'dirs.logs' ), filename ), log );

	const lines = log.split( '\n' );
	log = lines
		.filter( line => {
			return ! (
				line.startsWith( '> ' ) ||
				line.includes( 'pnpm run' ) ||
				line.includes( 'Done ' )
			);
		} )
		.join( '\n' );

	if ( log.length > 1 && E2E_DEBUG ) {
		logger.debug( '#### WP DEBUG.LOG ####' );
		logger.debug( log );
	}
}

async function logAccessLog() {
	const apacheLog = execSyncShellCommand( 'pnpx wp-env logs tests --watch=false' );

	const escapedDate = new Date().toISOString().split( '.' )[ 0 ].replace( /:/g, '-' );
	const filename = `access_${ escapedDate }.log`;
	fs.writeFileSync( path.resolve( config.get( 'dirs.logs' ), filename ), apacheLog );
}

/**
 * Formats a given file name by replacing unaccepted characters (e.g. space)
 *
 * @param {string}  filePath         the file path. can be absolute file path, file name only, with or without extension
 * @param {boolean} includeTimestamp if true, the current timestamp will be added as a prefix
 * @return {string} the formatted file path
 */
function fileNameFormatter( filePath, includeTimestamp = true ) {
	const parts = path.parse( path.normalize( filePath ) );
	let fileName = parts.name;
	const ext = parts.ext;
	const dirname = parts.dir;

	if ( includeTimestamp ) {
		fileName = `${ Date.now() }_${ fileName }`;
	}

	fileName = fileName.replace( /\W/g, '_' );

	return path.join( dirname, `${ fileName }${ ext }` );
}

/**
 * Reads and returns the content of the file expected to store an URL.
 * The file path is stored in config.
 * No validation is done on the file content, so an invalid URL can be returned.
 *
 * @return {string} the file content, or undefined in file doesn't exist or cannot be read
 */
function getReusableUrlFromFile() {
	let urlFromFile;
	try {
		urlFromFile = fs
			.readFileSync( config.get( 'temp.tunnels' ), 'utf8' )
			.replace( 'https:', 'http:' );
	} catch ( error ) {
		if ( error.code === 'ENOENT' ) {
			// We expect this, reduce noise in logs
			console.warn( "Tunnels file doesn't exist" );
		} else {
			console.error( error );
		}
	}
	return urlFromFile;
}

/**
 * There are two ways to set the target site url:
 * 1. Write it in 'temp.tunnels' file
 * 2. Set SITE_URL env variable. This overrides any value written in file
 * If none of the above is valid we throw an error
 */
function resolveSiteUrl() {
	let url = process.env.SITE_URL;

	if ( ! url ) {
		url = getReusableUrlFromFile();
	}

	validateUrl( url );
	return url;
}

/**
 * Throw an error if the passed parameter is not a valid URL
 *
 * @param {string} url the string to to be validated as URL
 */
function validateUrl( url ) {
	if ( ! new URL( url ) ) {
		throw new Error( `Undefined or invalid SITE_URL!` );
	}
}

module.exports = {
	execShellCommand,
	execSyncShellCommand,
	resetWordpressInstall,
	prepareUpdaterTest,
	execWpCommand,
	execMultipleWpCommands,
	logDebugLog,
	logAccessLog,
	fileNameFormatter,
	getReusableUrlFromFile,
	resolveSiteUrl,
	validateUrl,
};
