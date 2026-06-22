/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Developerportal_Credentialbuilder_Labels_Numberofassociations4Inputs */

const en_developerportal_credentialbuilder_labels_numberofassociations4 = /** @type {(inputs: Developerportal_Credentialbuilder_Labels_Numberofassociations4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Number of Associations`)
};

const es_developerportal_credentialbuilder_labels_numberofassociations4 = /** @type {(inputs: Developerportal_Credentialbuilder_Labels_Numberofassociations4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Number of Associations`)
};

const fr_developerportal_credentialbuilder_labels_numberofassociations4 = /** @type {(inputs: Developerportal_Credentialbuilder_Labels_Numberofassociations4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Number of Associations`)
};

const ar_developerportal_credentialbuilder_labels_numberofassociations4 = /** @type {(inputs: Developerportal_Credentialbuilder_Labels_Numberofassociations4Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Number of Associations`)
};

/**
* | output |
* | --- |
* | "Number of Associations" |
*
* @param {Developerportal_Credentialbuilder_Labels_Numberofassociations4Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const developerportal_credentialbuilder_labels_numberofassociations4 = /** @type {((inputs?: Developerportal_Credentialbuilder_Labels_Numberofassociations4Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Developerportal_Credentialbuilder_Labels_Numberofassociations4Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_developerportal_credentialbuilder_labels_numberofassociations4(inputs)
	if (locale === "es") return es_developerportal_credentialbuilder_labels_numberofassociations4(inputs)
	if (locale === "fr") return fr_developerportal_credentialbuilder_labels_numberofassociations4(inputs)
	return ar_developerportal_credentialbuilder_labels_numberofassociations4(inputs)
});
export { developerportal_credentialbuilder_labels_numberofassociations4 as "developerPortal.credentialBuilder.labels.numberOfAssociations" }