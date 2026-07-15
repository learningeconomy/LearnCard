/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Claimboost_Toast_Claimfail2Inputs */

const en_claimboost_toast_claimfail2 = /** @type {(inputs: Claimboost_Toast_Claimfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to claim Credential`)
};

const es_claimboost_toast_claimfail2 = /** @type {(inputs: Claimboost_Toast_Claimfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No se pudo reclamar la Credencial`)
};

const fr_claimboost_toast_claimfail2 = /** @type {(inputs: Claimboost_Toast_Claimfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Impossible de réclamer le justificatif`)
};

const ar_claimboost_toast_claimfail2 = /** @type {(inputs: Claimboost_Toast_Claimfail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Unable to claim Credential`)
};

/**
* | output |
* | --- |
* | "Unable to claim Credential" |
*
* @param {Claimboost_Toast_Claimfail2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const claimboost_toast_claimfail2 = /** @type {((inputs?: Claimboost_Toast_Claimfail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Claimboost_Toast_Claimfail2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_claimboost_toast_claimfail2(inputs)
	if (locale === "es") return es_claimboost_toast_claimfail2(inputs)
	if (locale === "fr") return fr_claimboost_toast_claimfail2(inputs)
	return ar_claimboost_toast_claimfail2(inputs)
});
export { claimboost_toast_claimfail2 as "claimBoost.toast.claimFail" }