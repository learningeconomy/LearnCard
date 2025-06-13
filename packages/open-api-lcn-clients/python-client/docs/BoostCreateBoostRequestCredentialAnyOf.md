# BoostCreateBoostRequestCredentialAnyOf


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**context** | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md) |  | 
**id** | **str** |  | [optional] 
**type** | **List[str]** |  | 
**issuer** | [**BoostSendBoostRequestCredentialAnyOfIssuer**](BoostSendBoostRequestCredentialAnyOfIssuer.md) |  | 
**credential_subject** | [**BoostSendBoostRequestCredentialAnyOfCredentialSubject**](BoostSendBoostRequestCredentialAnyOfCredentialSubject.md) |  | 
**refresh_service** | [**BoostSendBoostRequestCredentialAnyOfRefreshService**](BoostSendBoostRequestCredentialAnyOfRefreshService.md) |  | [optional] 
**credential_schema** | [**BoostSendBoostRequestCredentialAnyOfCredentialSchema**](BoostSendBoostRequestCredentialAnyOfCredentialSchema.md) |  | [optional] 
**issuance_date** | **str** |  | [optional] 
**expiration_date** | **str** |  | [optional] 
**credential_status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |  | [optional] 
**name** | **str** |  | [optional] 
**description** | **str** |  | [optional] 
**valid_from** | **str** |  | [optional] 
**valid_until** | **str** |  | [optional] 
**status** | [**BoostSendBoostRequestCredentialAnyOfCredentialStatus**](BoostSendBoostRequestCredentialAnyOfCredentialStatus.md) |  | [optional] 
**terms_of_use** | [**BoostSendBoostRequestCredentialAnyOfTermsOfUse**](BoostSendBoostRequestCredentialAnyOfTermsOfUse.md) |  | [optional] 
**evidence** | [**BoostSendBoostRequestCredentialAnyOfEvidence**](BoostSendBoostRequestCredentialAnyOfEvidence.md) |  | [optional] 

## Example

```python
from openapi_client.models.boost_create_boost_request_credential_any_of import BoostCreateBoostRequestCredentialAnyOf

# TODO update the JSON string below
json = "{}"
# create an instance of BoostCreateBoostRequestCredentialAnyOf from a JSON string
boost_create_boost_request_credential_any_of_instance = BoostCreateBoostRequestCredentialAnyOf.from_json(json)
# print the JSON string representation of the object
print(BoostCreateBoostRequestCredentialAnyOf.to_json())

# convert the object into a dict
boost_create_boost_request_credential_any_of_dict = boost_create_boost_request_credential_any_of_instance.to_dict()
# create an instance of BoostCreateBoostRequestCredentialAnyOf from a dict
boost_create_boost_request_credential_any_of_from_dict = BoostCreateBoostRequestCredentialAnyOf.from_dict(boost_create_boost_request_credential_any_of_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


