# InboxIssueBatchRequestConfiguration


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**guardian_email** | **str** | Require approval from this guardian before the recipient can claim. Must differ from the recipient email. | [optional] 
**signing_authority** | [**InboxIssueBatchRequestItemsInnerConfigurationSigningAuthority**](InboxIssueBatchRequestItemsInnerConfigurationSigningAuthority.md) |  | [optional] 
**webhook_url** | **str** | The webhook URL to receive credential issuance events. | [optional] 
**expires_in_days** | **int** | How many days the encrypted inbox payload remains claimable. This does not change the credential validity period. | [optional] 
**template_data** | **Dict[str, Optional[object]]** | Template data to render into the boost credential template using Mustache syntax. Only used when boostUri is provided. | [optional] 
**delivery** | [**InboxIssueBatchRequestConfigurationDelivery**](InboxIssueBatchRequestConfigurationDelivery.md) |  | [optional] 
**refresh** | **bool** | Enable managed refresh by default. An item configuration.refresh overrides this value, including false. | [optional] 

## Example

```python
from openapi_client.models.inbox_issue_batch_request_configuration import InboxIssueBatchRequestConfiguration

# TODO update the JSON string below
json = "{}"
# create an instance of InboxIssueBatchRequestConfiguration from a JSON string
inbox_issue_batch_request_configuration_instance = InboxIssueBatchRequestConfiguration.from_json(json)
# print the JSON string representation of the object
print(InboxIssueBatchRequestConfiguration.to_json())

# convert the object into a dict
inbox_issue_batch_request_configuration_dict = inbox_issue_batch_request_configuration_instance.to_dict()
# create an instance of InboxIssueBatchRequestConfiguration from a dict
inbox_issue_batch_request_configuration_from_dict = InboxIssueBatchRequestConfiguration.from_dict(inbox_issue_batch_request_configuration_dict)
```
[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)


