/**
 * Internal dependencies
 */
import JetpackBoostPage from '../../lib/pages/wp-admin/JetpackBoostPage';
import { boostPrerequisitesBuilder } from '../../lib/env/prerequisites';

const moduleName = 'render-blocking-js';
let jetpackBoostPage;

describe( 'Render Blocking JS module', () => {
	beforeAll( async () => {
		await boostPrerequisitesBuilder().withInactiveModules( [ moduleName ] ).build();
	} );

	beforeEach( async function () {
		jetpackBoostPage = await JetpackBoostPage.visit( page );
	} );

	it( 'should be disabled by default', async () => {
		expect( await jetpackBoostPage.isModuleEnabled( moduleName ) ).toBeFalsy();
	} );

	it( 'should allow enabling module', async () => {
		await jetpackBoostPage.toggleModule( moduleName );
		await jetpackBoostPage.waitForApiResponse( `${ moduleName }-status` );
		expect( await jetpackBoostPage.isModuleEnabled( moduleName ) ).toBeTruthy();
	} );

	it( 'should allow disabling module', async () => {
		await jetpackBoostPage.toggleModule( moduleName );
		await jetpackBoostPage.waitForApiResponse( `${ moduleName }-status` );
		expect( await jetpackBoostPage.isModuleEnabled( moduleName ) ).toBeFalsy();
	} );
} );
