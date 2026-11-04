# DidMetadataGetDidMetadata200Response

## Properties

| Name                      | Type                                                                                                                                    | Description | Notes      |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------- |
| **context**               | [**List[BoostSendBoostRequestCredentialAnyOfContextInner]**](BoostSendBoostRequestCredentialAnyOfContextInner.md)                       |             | [optional] |
| **id**                    | **str**                                                                                                                                 |             | [optional] |
| **also_known_as**         | **str**                                                                                                                                 |             | [optional] |
| **controller**            | [**BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType**](BoostSendBoostRequestCredentialAnyOfIssuerAnyOfType.md)                       |             | [optional] |
| **verification_method**   | [**List[DidMetadataGetDidMetadata200ResponseVerificationMethodInner]**](DidMetadataGetDidMetadata200ResponseVerificationMethodInner.md) |             | [optional] |
| **authentication**        | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md)         |             | [optional] |
| **assertion_method**      | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md)         |             | [optional] |
| **key_agreement**         | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md)         |             | [optional] |
| **capability_invocation** | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md)         |             | [optional] |
| **capability_delegation** | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md)         |             | [optional] |
| **public_key**            | [**List[DidMetadataGetDidMetadata200ResponseAuthenticationInner]**](DidMetadataGetDidMetadata200ResponseAuthenticationInner.md)         |             | [optional] |
| **service**               | [**List[DidMetadataAddDidMetadataRequestServiceInner]**](DidMetadataAddDidMetadataRequestServiceInner.md)                               |             | [optional] |
| **proof**                 | [**BoostSendBoostRequestCredentialAnyOfProof**](BoostSendBoostRequestCredentialAnyOfProof.md)                                           |             | [optional] |

## Example

```python
from openapi_client.models.did_metadata_get_did_metadata200_response import DidMetadataGetDidMetadata200Response

# TODO update the JSON string below
json = "{}"
# create an instance of DidMetadataGetDidMetadata200Response from a JSON string
did_metadata_get_did_metadata200_response_instance = DidMetadataGetDidMetadata200Response.from_json(json)
# print the JSON string representation of the object
print(DidMetadataGetDidMetadata200Response.to_json())

# convert the object into a dict
did_metadata_get_did_metadata200_response_dict = did_metadata_get_did_metadata200_response_instance.to_dict()
# create an instance of DidMetadataGetDidMetadata200Response from a dict
did_metadata_get_did_metadata200_response_from_dict = DidMetadataGetDidMetadata200Response.from_dict(did_metadata_get_did_metadata200_response_dict)
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
