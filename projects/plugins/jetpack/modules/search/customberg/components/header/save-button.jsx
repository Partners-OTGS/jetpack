/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { eventPrefix, recordEvent } from '../../lib/analytics';
import useEntityRecordState from '../../hooks/use-entity-record-state';
import { SERVER_OBJECT_NAME } from '../../../instant-search/lib/constants';

/**
 * Component for saving pending entity record changes.
 *
 * @returns {React.Element} component instance
 */
export default function SaveButton() {
	const {
		editedEntities: editedSettings,
		isSaving,
		hasUnsavedEdits,
		saveRecords,
	} = useEntityRecordState();

	const onClick = ( ...args ) => {
		if ( isSaving ) {
			return;
		}
		recordEvent( `${ eventPrefix }_save_button_click`, {
			initialSettings: JSON.stringify( window[ SERVER_OBJECT_NAME ].overlayOptions ),
			savedSettings: JSON.stringify( editedSettings ),
			savedSettingNames: Object.keys( editedSettings ).join( ',' ),
		} );
		saveRecords( ...args );
	};

	return (
		<Button
			aria-disabled={ isSaving }
			disabled={ ! hasUnsavedEdits }
			isBusy={ isSaving }
			isPrimary
			onClick={ onClick }
		>
			{ isSaving ? __( 'Saving…', 'jetpack' ) : __( 'Save', 'jetpack' ) }
		</Button>
	);
}
