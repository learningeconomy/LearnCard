/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Aiinsights_Requestaccessdescription3Inputs */

const en_aiinsights_requestaccessdescription3 = /** @type {(inputs: Aiinsights_Requestaccessdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Request access to view your students learning insights.`)
};

const es_aiinsights_requestaccessdescription3 = /** @type {(inputs: Aiinsights_Requestaccessdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Solicita acceso para ver los insights de aprendizaje de tus estudiantes.`)
};

const fr_aiinsights_requestaccessdescription3 = /** @type {(inputs: Aiinsights_Requestaccessdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demandez l'accès pour voir les insights d'apprentissage de vos élèves.`)
};

const ar_aiinsights_requestaccessdescription3 = /** @type {(inputs: Aiinsights_Requestaccessdescription3Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`اطلب الوصول لعرض رؤى تعلم طلابك.`)
};

/**
* | output |
* | --- |
* | "Request access to view your students learning insights." |
*
* @param {Aiinsights_Requestaccessdescription3Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const aiinsights_requestaccessdescription3 = /** @type {((inputs?: Aiinsights_Requestaccessdescription3Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Aiinsights_Requestaccessdescription3Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_aiinsights_requestaccessdescription3(inputs)
	if (locale === "es") return es_aiinsights_requestaccessdescription3(inputs)
	if (locale === "fr") return fr_aiinsights_requestaccessdescription3(inputs)
	return ar_aiinsights_requestaccessdescription3(inputs)
});
export { aiinsights_requestaccessdescription3 as "aiInsights.requestAccessDescription" }