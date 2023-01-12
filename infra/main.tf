terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate"
    storage_account_name = "tmtfstate1"
    container_name       = "tfstate"
    key                  = "meadonnet.terraform.tfstate"
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=3.7.0"
    }
  }
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = "meadon.net"
  location = "uksouth"
}
