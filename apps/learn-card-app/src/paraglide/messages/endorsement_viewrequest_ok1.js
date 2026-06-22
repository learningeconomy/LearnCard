/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Endorsement_Viewrequest_Ok1Inputs */

const en_endorsement_viewrequest_ok1 = /** @type {(inputs: Endorsement_Viewrequest_Ok1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OK`)
};

const es_endorsement_viewrequest_ok1 = /** @type {(inputs: Endorsement_Viewrequest_Ok1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aceptar`)
};

const fr_endorsement_viewrequest_ok1 = /** @type {(inputs: Endorsement_Viewrequest_Ok1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OK`)
};

const ar_endorsement_viewrequest_ok1 = /** @type {(inputs: Endorsement_Viewrequest_Ok1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`حسنًا`)
};

/**
* | output |
* | --- |
* | "OK" |
*
* @param {Endorsement_Viewrequest_Ok1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const endorsement_viewrequest_ok1 = /** @type {((inputs?: Endorsement_Viewrequest_Ok1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Endorsement_Viewrequest_Ok1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_endorsement_viewrequest_ok1(inputs)
	if (locale === "es") return es_endorsement_viewrequest_ok1(inputs)
	if (locale === "fr") return fr_endorsement_viewrequest_ok1(inputs)
	return ar_endorsement_viewrequest_ok1(inputs)
});
export { endorsement_viewrequest_ok1 as "endorsement.viewRequest.ok" }