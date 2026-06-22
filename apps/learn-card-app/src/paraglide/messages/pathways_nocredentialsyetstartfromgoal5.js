/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Pathways_Nocredentialsyetstartfromgoal5Inputs */

const en_pathways_nocredentialsyetstartfromgoal5 = /** @type {(inputs: Pathways_Nocredentialsyetstartfromgoal5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`No credentials yet — that's fine. We'll start from your goal.`)
};

const es_pathways_nocredentialsyetstartfromgoal5 = /** @type {(inputs: Pathways_Nocredentialsyetstartfromgoal5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aún no hay credenciales — no pasa nada. Empezaremos desde tu objetivo.`)
};

const fr_pathways_nocredentialsyetstartfromgoal5 = /** @type {(inputs: Pathways_Nocredentialsyetstartfromgoal5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun justificatif pour l'instant — ce n'est pas grave. Nous commencerons à partir de votre objectif.`)
};

const ar_pathways_nocredentialsyetstartfromgoal5 = /** @type {(inputs: Pathways_Nocredentialsyetstartfromgoal5Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`لا توجد بيانات اعتماد بعد — لا بأس بذلك. سنبدأ من هدفك.`)
};

/**
* | output |
* | --- |
* | "No credentials yet — that's fine. We'll start from your goal." |
*
* @param {Pathways_Nocredentialsyetstartfromgoal5Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const pathways_nocredentialsyetstartfromgoal5 = /** @type {((inputs?: Pathways_Nocredentialsyetstartfromgoal5Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pathways_Nocredentialsyetstartfromgoal5Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_pathways_nocredentialsyetstartfromgoal5(inputs)
	if (locale === "es") return es_pathways_nocredentialsyetstartfromgoal5(inputs)
	if (locale === "fr") return fr_pathways_nocredentialsyetstartfromgoal5(inputs)
	return ar_pathways_nocredentialsyetstartfromgoal5(inputs)
});
export { pathways_nocredentialsyetstartfromgoal5 as "pathways.noCredentialsYetStartFromGoal" }