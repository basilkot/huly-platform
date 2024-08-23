//
// Copyright © 2024 Hardcore Engineering Inc.
//
// Licensed under the Eclipse Public License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License. You may
// obtain a copy of the License at https://www.eclipse.org/legal/epl-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//
// See the License for the specific language governing permissions and
// limitations under the License.
//

import core, { Client, MeasureContext, systemAccountEmail, TxOperations, WorkspaceId } from '@hcengineering/core'
import { generateToken } from '@hcengineering/server-token'
import contact, { Person, PersonAccount } from '@hcengineering/contact'

import { connectPlatform } from './platform'

export class WorkspaceClient {
  client: Client | undefined
  opClient: Promise<TxOperations> | TxOperations

  initializePromise: Promise<void> | undefined = undefined

  constructor (
    readonly ctx: MeasureContext,
    readonly workspace: WorkspaceId
  ) {
    this.opClient = this.initClient()
    void this.opClient.then((opClient) => {
      this.opClient = opClient
    })
  }

  protected async initClient (): Promise<TxOperations> {
    const token = generateToken(systemAccountEmail, this.workspace)
    this.client = await connectPlatform(token)

    return new TxOperations(this.client, core.account.System)
  }

  async getAccount (email: string): Promise<PersonAccount | undefined> {
    const opClient = await this.opClient
    return await opClient.getModel().findOne(contact.class.PersonAccount, { email })
  }

  async getPerson (account: PersonAccount): Promise<Person | undefined> {
    const opClient = await this.opClient
    return await opClient.findOne(contact.class.Person, { _id: account.person })
  }

  async close (): Promise<void> {
    if (this.client === undefined) {
      return
    }

    await this.client?.close()

    if (this.opClient instanceof Promise) {
      void this.opClient.then((opClient) => {
        void opClient.close()
      })
    } else {
      await this.opClient.close()
    }
  }
}
