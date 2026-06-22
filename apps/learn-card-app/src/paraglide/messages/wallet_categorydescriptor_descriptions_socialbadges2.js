/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Descriptions_Socialbadges2Inputs */

const en_wallet_categorydescriptor_descriptions_socialbadges2 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Socialbadges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Social Badges are digital icons or labels used on online platforms to signify achievements, statuses, roles, or milestones of users. They serve to recognize accomplishments, indicate member roles, encourage participation, and foster community engagement. These badges can denote anything from completing tasks, participating in events, to being part of specific groups.`)
};

const es_wallet_categorydescriptor_descriptions_socialbadges2 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Socialbadges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las insignias sociales son íconos o etiquetas digitales que se usan en plataformas en línea para señalar logros, estados, roles o hitos de los usuarios. Sirven para reconocer logros, indicar roles de los miembros, fomentar la participación y promover la implicación de la comunidad. Estas insignias pueden representar desde completar tareas y participar en eventos hasta pertenecer a grupos específicos.`)
};

const fr_wallet_categorydescriptor_descriptions_socialbadges2 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Socialbadges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les badges sociaux sont des icônes ou des étiquettes numériques utilisés sur les plateformes en ligne pour signaler les réussites, les statuts, les rôles ou les étapes importantes des utilisateurs. Ils servent à reconnaître les accomplissements, à indiquer les rôles des membres, à encourager la participation et à favoriser l'engagement de la communauté. Ces badges peuvent représenter aussi bien l'achèvement de tâches et la participation à des événements que l'appartenance à des groupes spécifiques.`)
};

const ar_wallet_categorydescriptor_descriptions_socialbadges2 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Socialbadges2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الأوسمة الاجتماعية هي أيقونات أو علامات رقمية تُستخدم على المنصات الإلكترونية للدلالة على الإنجازات أو الحالات أو الأدوار أو المحطات المهمة للمستخدمين. وهي تخدم في تقدير الإنجازات والإشارة إلى أدوار الأعضاء وتشجيع المشاركة وتعزيز التفاعل المجتمعي. ويمكن أن تدلّ هذه الأوسمة على أمور متعددة، من إكمال المهام والمشاركة في الفعاليات إلى الانتماء إلى مجموعات محددة.`)
};

/**
* | output |
* | --- |
* | "Social Badges are digital icons or labels used on online platforms to signify achievements, statuses, roles, or milestones of users. They serve to recognize ..." |
*
* @param {Wallet_Categorydescriptor_Descriptions_Socialbadges2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_descriptions_socialbadges2 = /** @type {((inputs?: Wallet_Categorydescriptor_Descriptions_Socialbadges2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Descriptions_Socialbadges2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_descriptions_socialbadges2(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_descriptions_socialbadges2(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_descriptions_socialbadges2(inputs)
	return ar_wallet_categorydescriptor_descriptions_socialbadges2(inputs)
});
export { wallet_categorydescriptor_descriptions_socialbadges2 as "wallet.categoryDescriptor.descriptions.socialBadges" }