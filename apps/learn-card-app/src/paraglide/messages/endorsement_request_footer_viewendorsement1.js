/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Request_Footer_Viewendorsement1Inputs */

const en_endorsement_request_footer_viewendorsement1 = /** @type {(inputs: Endorsement_Request_Footer_Viewendorsement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`View Endorsement`)
};

const es_endorsement_request_footer_viewendorsement1 = /** @type {(inputs: Endorsement_Request_Footer_Viewendorsement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ver aval`)
};

const fr_endorsement_request_footer_viewendorsement1 = /** @type {(inputs: Endorsement_Request_Footer_Viewendorsement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir la recommandation`)
};

const ar_endorsement_request_footer_viewendorsement1 = /** @type {(inputs: Endorsement_Request_Footer_Viewendorsement1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عرض التوصية`)
};

/**
* | output |
* | --- |
* | "View Endorsement" |
*
* @param {Endorsement_Request_Footer_Viewendorsement1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_request_footer_viewendorsement1 = /** @type {((inputs?: Endorsement_Request_Footer_Viewendorsement1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Request_Footer_Viewendorsement1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_request_footer_viewendorsement1(inputs)
	if (locale === "es") return es_endorsement_request_footer_viewendorsement1(inputs)
	if (locale === "fr") return fr_endorsement_request_footer_viewendorsement1(inputs)
	return ar_endorsement_request_footer_viewendorsement1(inputs)
});
export { endorsement_request_footer_viewendorsement1 as "endorsement.request.footer.viewEndorsement" }