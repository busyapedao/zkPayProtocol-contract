/*
    Copyright 2018 0KIMS association.

    This file is part of circom (Zero Knowledge Circuit Compiler).

    circom is a free software: you can redistribute it and/or modify it
    under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    circom is distributed in the hope that it will be useful, but WITHOUT
    ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
    or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public
    License for more details.

    You should have received a copy of the GNU General Public License
    along with circom. If not, see <https://www.gnu.org/licenses/>.
*/
pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";

template Main() {
    signal input in[5];
    signal output out[5];

    component poseidon1 = Poseidon(2);
    component poseidon2 = Poseidon(4);

    poseidon1.inputs[0] <== in[0];  //psw
    poseidon1.inputs[1] <== in[1];  //address
    out[0] <== poseidon1.out; //boxhash

    poseidon2.inputs[0] <== poseidon1.out;
    poseidon2.inputs[1] <== in[2]; //tokenAddr
    poseidon2.inputs[2] <== in[3]; //amount
    poseidon2.inputs[3] <== in[4]; //expiration
    out[1] <== in[2]; //tokenAddr
    out[2] <== in[3]; //amount
    out[3] <== in[4]; //expiration
    out[4] <== poseidon2.out; //allhash
}

component main = Main();
